/**
 * Fotoğraf duvar kâğıdı galerisi — sabit, yerelde gömülü görseller
 * (public/wallpapers/, optimize edilmiş JPEG + küçük önizleme).
 * "photo" (WallpaperId) rastgele çevrimiçi çekim modundan ayrı: bunlar
 * Ayarlar'da tek tek seçilebilen, önizlemesi olan sabit fotoğraflar.
 *
 * Kaynak: Unsplash (ücretsiz lisans) — Nicolas Lafargue, Piermanuele Sberni.
 */

export type GalleryPhotoId = "alpenglow" | "dolomites" | "stormline";

export interface GalleryPhoto {
  id: GalleryPhotoId;
  name: string;
  src: string;
  thumb: string;
}

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: "alpenglow",
    name: "Alpenglow",
    src: "/wallpapers/alpenglow.jpg",
    thumb: "/wallpapers/thumb/alpenglow.jpg",
  },
  {
    id: "dolomites",
    name: "Dolomites",
    src: "/wallpapers/dolomites.jpg",
    thumb: "/wallpapers/thumb/dolomites.jpg",
  },
  {
    id: "stormline",
    name: "Stormline",
    src: "/wallpapers/stormline.jpg",
    thumb: "/wallpapers/thumb/stormline.jpg",
  },
];

const byId = new Map<string, GalleryPhoto>(GALLERY_PHOTOS.map((p) => [p.id, p]));

export function getGalleryPhoto(id: string): GalleryPhoto | undefined {
  return byId.get(id);
}
