# -*- coding: utf-8 -*-
import json
import math
from typing import List, Dict

# === utils logic (embedded for Pyodide) ===

def filter_by_publisher(items: List[Dict], publisher: str) -> List[Dict]:
    return [c for c in items if c.get('publisher','').lower() == publisher.lower()]


def price_per_page(c: Dict) -> float:
    price = c.get('price_huf')
    pages = c.get('pages')
    if not price or not pages or pages <= 0:
        return math.inf
    return price / pages


def roi_proxy(c: Dict) -> float:
    price = c.get('price_huf') or 0
    pages = c.get('pages') or 0
    rating = c.get('rating') or 0
    if price <= 0:
        return 0.0
    return (rating * pages) / price


def rank(items: List[Dict]) -> List[Dict]:
    def key(c):
        return (-float(c.get('rating', 0)), price_per_page(c), -int(c.get('year', 0)))
    return sorted(items, key=key)


def enrich(items: List[Dict]) -> List[Dict]:
    out = []
    for c in items:
        e = c.copy()
        e['price_per_page'] = None if price_per_page(c) == math.inf else round(price_per_page(c), 2)
        e['roi_proxy'] = round(roi_proxy(c), 4)
        out.append(e)
    return out


def neutral_summary_stub(title: str, publisher: str, year: int, pages: int) -> str:
    return (f"A(z) '{title}' egy {year}-ben megjelent {publisher} kiadvány. "
            f"A kötet terjedelme {pages} oldal.")


# === Main recommender ===

def recommend(answers_json: str, comics_json: str) -> str:
    answers = json.loads(answers_json)
    comics = json.loads(comics_json)

    # Step 1: Filter by publisher
    likes_dc = answers.get("dc", False)
    likes_marvel = answers.get("marvel", False)

    if likes_dc and likes_marvel:
        filtered = comics[:]
        universe = "DC & Marvel"
    elif likes_dc:
        filtered = filter_by_publisher(comics, "DC")
        universe = "DC"
    elif likes_marvel:
        filtered = filter_by_publisher(comics, "Marvel")
        universe = "Marvel"
    else:
        filtered = comics[:]
        universe = "DC & Marvel"

    # Step 2: Apply preference filters
    if answers.get("short"):
        filtered = [c for c in filtered if c.get('pages', 0) <= 200]

    if answers.get("budget"):
        filtered = [c for c in filtered if price_per_page(c) < 50]

    if answers.get("modern"):
        filtered = [c for c in filtered if c.get('year', 0) >= 2000]

    if answers.get("top_rated"):
        high = [c for c in filtered if c.get('rating', 0) >= 4.7]
        if high:
            filtered = high

    # Step 3: Rank and enrich
    ranked = enrich(rank(filtered))

    # Fallback: if filters too strict, show all from universe
    if not ranked:
        ranked = enrich(rank(filter_by_publisher(comics, universe)))

    top = ranked[:8]

    # Build recommendations
    recs = []
    for c in top:
        ppp = c.get('price_per_page')
        ppp_str = f"{ppp} Ft/oldal" if ppp is not None else "–"
        chars = ", ".join(c.get('characters', []))

        recs.append({
            "title": c['title'],
            "description": (
                f"{c['publisher']} · {c['year']} · {c['pages']} oldal · "
                f"{c['price_huf']} Ft · ⭐ {c['rating']}"
            ),
            "why": neutral_summary_stub(c['title'], c['publisher'], c['year'], c['pages']),
            "details": {
                "price_per_page": ppp_str,
                "roi": c.get('roi_proxy', 0),
                "characters": chars
            }
        })

    # Reasoning
    yes_list = [k for k, v in answers.items() if v]
    no_list = [k for k, v in answers.items() if not v]

    labels = {
        "dc": "DC univerzum",
        "marvel": "Marvel univerzum",
        "short": "rövidebb kötetek",
        "budget": "kedvező ár/oldal arány",
        "modern": "modern (2000+) kiadványok",
        "top_rated": "kiemelkedő értékelésű címek"
    }

    reasoning = f"Választott univerzum: {universe}. "
    prefs = [labels.get(k, k) for k in yes_list if k not in ("dc", "marvel")]
    if prefs:
        reasoning += "Preferenciáid: " + ", ".join(prefs) + ". "
    reasoning += f"Az adatbázisból {len(top)} kötetet válogattunk neked, értékelés és ár-érték arány alapján rangsorolva."

    result = {
        "title": f"Top {universe} ajánlatok neked",
        "recommendations": recs,
        "reasoning": reasoning
    }

    return json.dumps(result, ensure_ascii=False)
