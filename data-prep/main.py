import csv
import random

total = 44448


def main():

    indicies: set[int] = {0}

    while len(indicies) < 1000:
        indicies.add(random.randint(0, total))

    imagesfile = open("images.csv")
    stylesfile = open("styles.csv")

    imagereader = csv.reader(imagesfile, delimiter=",")
    stylereader = csv.reader(stylesfile, delimiter=",")

    imagerows = []
    stylerows = []

    i = 0
    for row in imagereader:
        if i in indicies:
            imagerows.append(",".join(row) + "\n")
        i += 1
    i = 0
    for row in stylereader:
        if i in indicies:
            stylerows.append(",".join(row) + "\n")
        i += 1

    imagesfile.close()
    stylesfile.close()

    newimagefile = open("images_out.csv", "w")
    newstylesfile = open("styles_out.csv", "w")

    newimagefile.writelines(imagerows)
    newstylesfile.writelines(stylerows)

    newimagefile.close()
    newstylesfile.close()


if __name__ == '__main__':
    main()