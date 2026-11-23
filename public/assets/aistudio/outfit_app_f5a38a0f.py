import random
import tkinter as tk

shirts = [
    "black short sleeve polo",
    "blue short sleeve polo",
    "khaki polo",
    "khaki full sleeve polo",
    "dark blue army green short sleeve polo",
    "maroon short sleeve",
    "black short sleeve",
    "white short sleeve",
    "yellow short sleeve",
    "army green short sleeve",
    "grey short sleeve",
    "parrot green short sleeve",
    "light green short sleeve",
    "blue full sleeve",
    "army green long sleeve",
    "black long sleeve",
    "grey long sleeve",
    "white full sleeve"
]

trousers = [
    "khaki trouser",
    "navy blue trouser",
    "red trouser",
    "red corduroy trouser"
]

def is_neutral(color):
    return color in ["black", "white", "grey", "navy", "khaki"]

def extract_color(item):
    return item.split()[0]

def fashionable_combo(shirt, trouser):
    shirt_color = extract_color(shirt)
    trouser_color = extract_color(trouser)

    if is_neutral(shirt_color):
        return True

    if trouser_color == "red":
        if shirt_color in ["yellow", "maroon", "parrot", "light", "army"]:
            return False

    if shirt_color in ["maroon", "army", "khaki"]:
        if trouser_color in ["khaki", "navy"]:
            return True
        else:
            return False

    if trouser_color == "red" and "corduroy" in trouser:
        if shirt_color not in ["black", "white", "grey", "navy", "dark"]:
            return False

    return True

stylish_combos = [
    (shirt, trouser)
    for shirt in shirts
    for trouser in trousers
    if fashionable_combo(shirt, trouser)
]

def generate_outfit():
    shirt, trouser = random.choice(stylish_combos)
    label.config(text=f"{shirt} + {trouser}")

root = tk.Tk()
root.title("Today's Outfit")

label = tk.Label(root, text="", font=("Arial", 16), padx=20, pady=20)
label.pack()

button = tk.Button(root, text="New Outfit", command=generate_outfit, font=("Arial", 14))
button.pack(pady=10)

generate_outfit()

root.mainloop()