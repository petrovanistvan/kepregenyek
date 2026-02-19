import json

def recommend(answers_json: str) -> str:
    """
    Takes a JSON string of answers (dict of question_id -> bool)
    and returns a JSON string with recommendations.

    Replace this placeholder logic with your own recommendation engine.
    The interface contract:
      Input:  {"action": true, "humor": false, ...}
      Output: {"title": "...", "recommendations": [...], "reasoning": "..."}
    Each recommendation: {"title": "...", "description": "...", "why": "..."}
    """
    answers = json.loads(answers_json)

    recs = []

    if answers.get("action"):
        recs.append({
            "title": "Invincible",
            "description": "A coming-of-age superhero story that starts familiar, then takes shocking turns.",
            "why": "You like action — Invincible delivers jaw-dropping fight scenes with real consequences."
        })
        recs.append({
            "title": "Batman: Year One",
            "description": "Frank Miller's grounded take on Bruce Wayne's first year as Batman.",
            "why": "An action-packed origin story that redefined the Dark Knight."
        })

    if answers.get("humor"):
        recs.append({
            "title": "Scott Pilgrim",
            "description": "A slacker musician must defeat his new girlfriend's seven evil exes.",
            "why": "It's hilarious, quirky, and full of video-game-style energy."
        })
        recs.append({
            "title": "Squirrel Girl",
            "description": "Doreen Green fights villains with the power of squirrels — and empathy.",
            "why": "Light-hearted, funny, and perfect for readers who don't take things too seriously."
        })

    if answers.get("dark"):
        recs.append({
            "title": "Watchmen",
            "description": "The genre-defining deconstruction of superheroes in a Cold War world.",
            "why": "A mature, layered masterpiece that explores what 'heroism' really means."
        })
        recs.append({
            "title": "Saga",
            "description": "An epic space opera about two soldiers from warring races who fall in love.",
            "why": "Beautiful, brutal, and emotionally raw — one of the best modern comics."
        })

    if answers.get("scifi"):
        recs.append({
            "title": "Paper Girls",
            "description": "Four paper delivery girls stumble into a time-travel conflict in 1988.",
            "why": "A nostalgic sci-fi adventure with twists you won't see coming."
        })

    if answers.get("fantasy"):
        recs.append({
            "title": "Bone",
            "description": "Three cartoon cousins get lost in a vast fantasy world full of danger and humor.",
            "why": "An all-ages fantasy epic — think Lord of the Rings meets cartoon comedy."
        })
        recs.append({
            "title": "Monstress",
            "description": "A young woman navigates a war-torn world of gods and monsters.",
            "why": "Stunning art and deep world-building for fantasy lovers."
        })

    if answers.get("realistic"):
        recs.append({
            "title": "Maus",
            "description": "Art Spiegelman's Pulitzer-winning memoir of his father's Holocaust survival.",
            "why": "A powerful true story told through comics — essential reading."
        })
        recs.append({
            "title": "Persepolis",
            "description": "Marjane Satrapi's memoir of growing up during the Iranian Revolution.",
            "why": "Real-world, deeply personal, and beautifully illustrated."
        })

    if answers.get("ongoing") is False:
        # Prefers ongoing series
        ongoing = [
            {
                "title": "One Piece (Manga)",
                "description": "The best-selling manga of all time — a pirate adventure of epic scope.",
                "why": "Still running and consistently excellent; perfect if you want a long journey."
            }
        ]
        recs.extend(ongoing)

    # Fallback if nothing matched
    if not recs:
        recs = [
            {
                "title": "Saga",
                "description": "An epic space opera mixing sci-fi and fantasy with deep emotion.",
                "why": "A universally loved starting point for new comic readers."
            },
            {
                "title": "Ms. Marvel (Kamala Khan)",
                "description": "A Pakistani-American teen discovers she has superpowers.",
                "why": "Relatable, fun, and a great entry into the Marvel universe."
            },
            {
                "title": "Bone",
                "description": "Three cartoon cousins lost in a vast fantasy world.",
                "why": "Charming and accessible — great for any taste."
            }
        ]

    # Build reasoning summary
    yes_answers = [k for k, v in answers.items() if v]
    no_answers = [k for k, v in answers.items() if not v]

    reasoning = "Based on your preferences: "
    if yes_answers:
        reasoning += "you enjoy " + ", ".join(yes_answers) + ". "
    if no_answers:
        reasoning += "You're less interested in " + ", ".join(no_answers) + ". "
    reasoning += f"We picked {len(recs)} comics that match your taste."

    result = {
        "title": "Your Personalized Reading List",
        "recommendations": recs[:8],
        "reasoning": reasoning
    }

    return json.dumps(result)
