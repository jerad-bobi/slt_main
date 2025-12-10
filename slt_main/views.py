import json
import re
from urllib import error, request as urlrequest

from django.shortcuts import render
from django.template.loader import select_template
from django.http import JsonResponse


def _fetch_definitions(word: str):
    """Fetch definitions from dictionaryapi.dev; return simplified data."""
    if not word:
        return {}

    api_url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    try:
        with urlrequest.urlopen(api_url, timeout=6) as resp:
            payload = json.load(resp)
    except Exception:
        return {}

    if not isinstance(payload, list) or not payload:
        return {}

    entry = payload[0]
    pronunciations = entry.get("phonetics", [])
    pronounce = pronunciations[0].get("text") if pronunciations else None

    meanings = entry.get("meanings", [])
    if meanings:
        pos = meanings[0].get("partOfSpeech")
        defs = []
        synonyms = []
        for meaning in meanings:
            part = meaning.get("partOfSpeech")
            for d in meaning.get("definitions", [])[:4]:
                defs.append(
                    {
                        "definition": d.get("definition"),
                        "example": d.get("example"),
                        "partOfSpeech": part,
                    }
                )
            synonyms.extend(meaning.get("synonyms", [])[:6])
    else:
        pos = None
        defs = []
        synonyms = []

    return {
        "word": entry.get("word", word),
        "pronounce": pronounce,
        "partOfSpeech": pos,
        "definitions": defs,
        "synonyms": synonyms[:8],
    }


def _fetch_asl_video(word: str):
    """Fetch first ASL video URL from SignASL; scrape page as fallback."""
    if not word:
        return None

    # Newer site does not return JSON search; scrape the sign page for an mp4.
    page_url = f"https://www.signasl.org/sign/{word}"
    try:
        with urlrequest.urlopen(page_url, timeout=8) as resp:
            html = resp.read().decode("utf-8", "ignore")
    except Exception:
        return None

    # Look for the first mp4 URL in the page (SignASL/SignBSL hosts media there).
    match = re.search(r"https?://[^\"']+\.mp4", html)
    if match:
        return _normalize_url(match.group(0))
    return None


def _normalize_url(url: str):
    """Ensure URL is usable (prefer https, handle protocol-relative)."""
    if not url:
        return None
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("http://"):
        return url.replace("http://", "https://", 1)
    return url


def home(request):
    return render(request, 'home.html')


def level(request):
    return render(request, 'level.html')


def practice(request):
    return render(request, 'practice.html')


def dictionary(request):
    mode = request.GET.get('mode', 'words')
    query = request.GET.get('q', '').strip()

    is_letters = mode == 'letters'

    if is_letters:
        # For letters mode we only fetch ASL video; definitions are skipped.
        entry = {}
        asl_video = _fetch_asl_video(query) if query else None
    else:
        entry = _fetch_definitions(query) if query else {}
        asl_video = _fetch_asl_video(query) if query else None

    context = {
        'query': query,
        'mode': 'letters' if is_letters else 'words',
        'entry': entry,
        'asl_video': asl_video,
    }
    return render(request, 'dictionary.html', context)


def chapter(request, chapter_num):
    """Render chapter page for chapters 1-8."""
    if chapter_num < 1 or chapter_num > 8:
        return render(request, 'level.html')  # Redirect to level if invalid
    
    # Map chapter numbers to letters (1=A, 2=B, ..., 8=H)
    letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    chapter_letter = letters[chapter_num - 1]

    # Chapter-specific resources
    chapter_resources = {}
    if chapter_num == 1:
        # Fetch key videos for chapter 1 basics
        basics = ['yes', 'no', 'maybe', 'hello', 'thank you', 'nice to meet you', 'my name']
        videos = {term: _fetch_asl_video(term) for term in basics}
        alphabet_letters = [chr(c) for c in range(ord('A'), ord('Z') + 1)]
        alphabet_videos = {letter: _fetch_asl_video(letter.lower()) for letter in alphabet_letters}
        alphabet_entries = [
            {
                "title": letter,
                "video": alphabet_videos.get(letter),
            }
            for letter in alphabet_letters
        ]
        def phrase_entry(title, key, segments=None):
            primary = videos.get(key)
            seg_urls = []
            if not primary and segments:
                seg_urls = [videos.get(seg) or _fetch_asl_video(seg) for seg in segments]
                seg_urls = [u for u in seg_urls if u]
            return {
                'title': title,
                'video': primary,
                'segment_urls': seg_urls,
            }

        chapter_resources = {
            'alphabet': alphabet_entries,
            'responses': [
                {'title': 'YES', 'video': videos.get('yes')},
                {'title': 'NO', 'video': videos.get('no')},
                {'title': 'MAYBE', 'video': videos.get('maybe')},
            ],
            'phrases': [
                phrase_entry('HELLO', 'hello'),
                phrase_entry('MY NAME ___', 'my name', segments=['my', 'name']),
                phrase_entry('NICE TO MEET YOU', 'nice to meet you', segments=['nice', 'meet', 'you']),
                phrase_entry('THANK YOU', 'thank you', segments=['thank', 'you']),
            ],
        }
    
    context = {
        'chapter_number': chapter_num,
        'chapter_letter': chapter_letter,
        'chapter_resources': chapter_resources,
    }
    template = select_template([
        f'chapters/chapter{chapter_num}.html',
        'chapter.html',
    ])
    return render(request, template.template.name, context)


def profile(request):
    return render(request, 'profile.html')


def asl_video_api(request):
    """Return first SignASL mp4 for the given query (text-to-sign lookup)."""
    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse({'error': 'Missing query'}, status=400)

    # Split into words for phrase support; strip punctuation so symbols don't break lookups
    words = []
    for w in re.split(r"\s+", query):
        token = re.sub(r"^[^\w]+|[^\w]+$", "", w)
        if token:
            words.append(token)

    if not words:
        return JsonResponse({'error': 'No valid words'}, status=400)

    videos = []
    for w in words:
        url = _fetch_asl_video(w)
        if url:
            videos.append({'word': w, 'video': url})
            continue

        # Fallback: spell the word with letter clips
        spelling = []
        for ch in w:
            if ch.isalpha():
                letter_url = _fetch_asl_video(ch.lower())
                if letter_url:
                    spelling.append(letter_url)
        if spelling:
            videos.append({'word': w, 'video': None, 'spelling': spelling})

    # Also attempt full phrase video as primary
    phrase_video = _fetch_asl_video(" ".join(words))

    return JsonResponse({
        'video': phrase_video,
        'segments': videos,
    })
