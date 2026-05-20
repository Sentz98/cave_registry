# PR Notes — GPX/KML Export & Parking Navigation

## Summary

Adds one-click GPS export and navigation support to the cave detail page. Users can now download a GPX file for handheld GPS units and open turn-by-turn directions to the parking area directly from any cave page.

---

## Changes

### Backend

**`caves/models.py`**
- Added `parking_location` (`PointField`, nullable) — stores the parking area coordinates for a cave.
- Added `parking_notes` (`CharField(500)`, nullable) — optional free-text description of the parking spot.

**`caves/migrations/0002_cave_parking.py`**
- Migration for the two new fields above.

**`caves/serializers.py`**
- `CaveSerializer`: added computed read fields `parking_latitude`, `parking_longitude`, and `parking_notes`.
- `CaveWriteSerializer`: added write-only `parking_latitude` / `parking_longitude` fields; `create` and `update` methods now convert them into a `Point` object, and clear the point when null values are submitted.

---

### Frontend

**`src/api/caves.ts`**
- `Cave` interface: added `parking_latitude`, `parking_longitude`, `parking_notes`.
- `CaveWritePayload` interface: added the same three optional fields.

**`src/pages/CaveForm.tsx`**
- New **Parcheggio** section (optional) with lat, lon, and notes inputs, shown between the main cave fields and the description.
- Initial state and edit-mode hydration updated to include parking fields.

**`src/utils/gpxExport.ts`** *(new file)*
- `generateGpx(cave)` — builds a GPX 1.1 document with:
  - A `<wpt>` for the parking area (if set), symbol `Parking Area`.
  - A `<wpt>` for the cave entrance, symbol `Cave`.
  - A `<rte>` with two route points connecting parking → entrance.
- `downloadGpx(cave)` — triggers a browser download of the `.gpx` file.
- `openMapsToParking(cave)` — opens Google Maps driving directions to the parking coordinates; falls back to the cave entrance if no parking is defined.

**`src/pages/CaveDetail.tsx`**
- Imported `MapPinIcon` and the two export utilities.
- Mini-map now shows an amber dot for the parking location (when present) with a tooltip; map auto-fits bounds to show both parking and entrance.
- Two new buttons rendered below the map:
  - **Scarica GPX** — downloads the GPX trace.
  - **Naviga al parcheggio** / **Naviga all'ingresso** — opens Google Maps.
- Parking notes displayed as a caption below the buttons.

---

## Limitations / Follow-up

- The current model supports **one entrance per cave**. Multi-entrance support would require a separate `CaveEntrance` child model (discussed, not implemented).
- The GPX route is a straight line between parking and entrance; no turn-by-turn routing is performed (no external API dependency).
- KML export was not added; GPX is sufficient for all major handheld GPS units (Garmin, Hammerhead, etc.) and can be imported into Google Earth if needed.
