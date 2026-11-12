
import re
from flask import Flask, render_template, request, jsonify, send_from_directory

app = Flask(__name__, template_folder=".", static_folder=None)

def check_password(password):
    conditions = {
        "length": len(password) >= 8,
        "uppercase": bool(re.search(r"[A-Z]", password)),
        "lowercase": bool(re.search(r"[a-z]", password)),
        "digit": bool(re.search(r"[0-9]", password)),
        "special": bool(re.search(r"[@#$%!&*]", password))
    }

    score = sum(conditions.values())

    if not conditions["length"]:
        strength = "Weak"
    elif score == 5:
        strength = "Strong"
    elif score >= 3:
        strength = "Medium"
    else:
        strength = "Weak"

    return {
        "strength": strength,
        "score": score,
        "conditions": conditions
    }

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/style.css")
def css():
    return send_from_directory(".", "style.css")

@app.route("/script.js")
def javascript():
    return send_from_directory(".", "script.js")

@app.route("/check", methods=["POST"])
def check():
    data = request.get_json(silent=True) or {}
    password = data.get("password", "")

    result = check_password(password)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
