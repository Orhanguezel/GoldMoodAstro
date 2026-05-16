# Relax mixer stems (FAZ 35)

8 adet gapless loop (`.m4a`), contract: `doc/contracts/relax-music-engine-contract.md`

| Dosya | stem_id |
|-------|---------|
| `pad.m4a` | pad |
| `rain.m4a` | rain |
| `wind.m4a` | wind |
| `water.m4a` | water |
| `chimes.m4a` | chimes |
| `forest.m4a` | forest |
| `binaural.m4a` | binaural |
| `crackle.m4a` | crackle |

Dosyalar `scripts/generate-relax-stems.ts` ile proje içinde procedural olarak üretilir.
Manifest ve hash doğrulaması: `frontend/public/sounds/relax/licenses.md`.
CI guard: `cd frontend && bun run relax:asset-guard`.
