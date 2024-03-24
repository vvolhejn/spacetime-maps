# Spacetime maps

Maps where distance represents travel time instead of physical distance.
Try them [here](https://spacetime-maps.vercel.app/).
**For a detailed explanation of how these work, [see the YouTube video](https://www.youtube.com/watch?v=rC2VQ-oyDG0).**

https://github.com/vvolhejn/spacetime-map/assets/8401624/43384b01-68a9-426f-bcf6-a1828d2073d4

## Project structure

- `backend/` - Python backend. It uses the Google Maps API to create grids of points along with travel time information.
- `frontend/src/assets/` - contains the static map images and the grid JSONs created in `backend/`
- `frontend/` - TypeScript + React frontend. It takes the data from the backend and actually bends and shows the maps.
  The newest frontend is automatically deployed [here](https://spacetime-maps.vercel.app/) using [Vercel](https://vercel.com/).
- `cavalry/` - just some personal backups of Cavalry animation files that I used in [the YouTube video](https://www.youtube.com/watch?v=rC2VQ-oyDG0).
  Safe to ignore.

## Installation

The backend can be installed using [Poetry](https://python-poetry.org/):

```shell
cd backend
poetry install
```

The frontend can be installed using npm:
```shell
cd frontend
npm install
```

## Running the frontend

```shell
cd frontend
npm run dev
```

## Adding new maps

Use the `backend/export.py` script. For example, to create the public transport map for NYC, I used this command:

```shell
python backend/export.py \
    --output-name newyork_transit \
    --center '40.75829440050091' '-73.91915960717802' \
    --zoom 12 \
    --grid-size 19 \
    --travel-mode TRANSIT
```

This is an interactive command that will preview the map in several stages. It'll also prompt you before spending
money on the Google Maps API.

It places the created maps into `frontend/src/assets` where the frontend can find them.
To make the new map available from the frontend dropdown menu, you'll need to add an entry in `cityData.ts`.
See existing entries for examples.

If you find some places that look good as spacetime maps, please submit a pull request!
I'd be happy to add more maps.

## Credits

I made the favicon based on [this](https://www.freepik.com/icon/map-pin_9356230) icon from Freepik user Anggara.
I then used a modified version of [this CodePen](https://codepen.io/V-clav-Volhejn/pen/KKbmKVb?editors=1010)
that I had used for a bug report before.

"Click and hold" icon: https://www.iconpacks.net/free-icon/click-2387.html