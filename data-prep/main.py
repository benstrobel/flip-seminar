import csv
import urllib.request

total = 44448


def download_images():
    imagesfile = open("images_out.csv")
    imagereader = csv.reader(imagesfile, delimiter=",")

    first = True
    index = 0
    for imagerow in imagereader:
        if first:
            first = False
            continue
        urllib.request.urlretrieve(imagerow[1], "./out/" + imagerow[0])
        index += 1
        if index % 10 == 0:
            print(index)

    imagesfile.close()


def map_seasons(season_name):
    match season_name:
        case "Summer": return "Summer"
        case "Fall": return "Fall"
        case "Winter": return "Winter"
        case "Spring": return "Spring"
        case "": return "Spring"


def map_usages(usage_name):
    match usage_name:
        case "Casual":
            return "Casual"
        case "Party":
            return "Casual"
        case "Sports":
            return "Sports"
        case "Ethnic":
            return "Ethnic"
        case "Formal":
            return "Formal"
        case "Smart Casual":
            return "Formal"
        case "NA":
            return "Ethnic"
        case "":
            return "Ethnic"
        case None:
            return "Ethnic"
        case "Travel":
            return "Formal"
        case "Home":
            return "Casual"


def map_colors(color_name):
    match color_name:
        case "Purple":
            return "Red"
        case "Red":
            return "Red"
        case "Maroon":
            return "Red"
        case "Rust":
            return "Red"
        case "Mauve":
            return "Red"
        case "Burgundy":
            return "Red"
        case "Rose":
            return "Red"
        case "Peach":
            return "Red"
        case "Magenta":
            return "Red"
        case "Pink":
            return "Red"
        case "Copper":
            return "Red"
        case "Blue":
            return "Blue"
        case "Lavender":
            return "Blue"
        case "Navy Blue":
            return "Blue"
        case "Teal":
            return "Blue"
        case "Turquoise Blue":
            return "Blue"
        case "Fluorescent Green":
            return "Green"
        case "Sea Green":
            return "Green"
        case "Green":
            return "Green"
        case "Olive":
            return "Green"
        case "Lime Green":
            return "Green"
        case "Yellow":
            return "Yellow"
        case "Bronze":
            return "Yellow"
        case "Orange":
            return "Yellow"
        case "Tan":
            return "Yellow"
        case "Mustard":
            return "Yellow"
        case "Khaki":
            return "Yellow"
        case "Cream":
            return "White"
        case "Steel":
            return "White"
        case "Silver":
            return "White"
        case "Metallic":
            return "White"
        case "Gold":
            return "White"
        case "Nude":
            return "White"
        case "White":
            return "White"
        case "Grey Melange":
            return "White"
        case "Off White":
            return "White"
        case "Skin":
            return "White"
        case "Beige":
            return "White"
        case "Coffee Brown":
            return "Black"
        case "NA":
            return "Black"
        case "Charcoal":
            return "Black"
        case "Taupe":
            return "Black"
        case "Grey":
            return "Black"
        case "Brown":
            return "Black"
        case "Mushroom Brown":
            return "Black"
        case "Black":
            return "Black"
        case "Multi":
            return "Black"


def get_block_list(values: dict[str, int], threshold=0.5):
    blocklist: set[str] = set()
    for k0, v0 in values.items():
        for k1, v1 in values.items():
            if v0 < v1 and (v0 / v1 if v1 > 0 else 1) < threshold:
                blocklist.add(k1)
            elif v0 > v1 and (v1 / v0 if v0 > 0 else 1) < threshold:
                blocklist.add(k0)
    return list(blocklist)


def select_styles():
    colors: dict[str, int] = {"Red": 0, "Blue": 0, "Green": 0, "Yellow": 0, "White": 0, "Black": 0}
    seasons: dict[str, int] = {"Summer": 0, "Fall": 0, "Winter": 0, "Spring": 0}
    usages: dict[str, int] = {"Casual": 0, "Sports": 0, "Ethnic": 0, "Formal": 0}

    imagesfile = open("images.csv")
    stylesfile = open("styles.csv")

    imagereader = csv.reader(imagesfile, delimiter=",")
    stylereader = csv.reader(stylesfile, delimiter=",")

    indicies: set[int] = set()

    # very inefficient but good enough, only needs to run once
    index = 0
    first = True
    for row in stylereader:
        if first:
            first = False
            continue
        colorblocklist = get_block_list(colors)
        seasonsblocklist = get_block_list(seasons)
        usagesblocklist = get_block_list(usages)
        color = map_colors(row[5])
        season = map_seasons(row[6])
        usage = map_usages(row[8])
        if (color not in colorblocklist) and (season not in seasonsblocklist) and (usage not in usagesblocklist):
            indicies.add(index)
            colors[color] += 1
            seasons[season] += 1
            usages[usage] += 1
        index += 1
        if index % 1000 == 0:
            print(index)

    print(str(colors) + " " + str(seasons) + " " + str(usages))
    print(len(indicies))
    print(list(indicies))

    imagerows = []
    stylerows = []

    index = 0
    imagesfile.seek(0)
    first = True
    for row in imagereader:
        if first:
            first = False
            imagerows.append(",".join(row) + "\n")
            continue
        if index in indicies:
            imagerows.append(",".join(row) + "\n")
        index += 1
    index = 0
    stylesfile.seek(0)
    first = True
    for row in stylereader:
        if first:
            first = False
            stylerows.append(",".join(row) + "\n")
            continue
        if index in indicies:
            row[5] = map_colors(row[5])
            row[6] = map_seasons(row[6])
            row[8] = map_usages(row[8])
            stylerows.append(",".join(row) + "\n")
        index += 1

    imagesfile.close()
    stylesfile.close()

    newimagefile = open("images_out.csv", "w")
    newstylesfile = open("styles_out.csv", "w")

    newimagefile.writelines(imagerows)
    newstylesfile.writelines(stylerows)

    newimagefile.close()
    newstylesfile.close()


if __name__ == '__main__':
    select_styles()
    download_images()
