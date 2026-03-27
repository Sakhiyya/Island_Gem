import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Fix Leaflet marker icons */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function DestinationMap({ destinations }) {
  return (
    <MapContainer
      center={[-20.3484, 57.5522]} // Center Mauritius
      zoom={10}
      scrollWheelZoom={true} // <--- enable zooming
      style={{
        height: "500px",
        width: "100%",
        borderRadius: "24px",
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {destinations.map((place) => (
        <Marker key={place.id} position={place.coords}>
          <Popup>
            <strong>{place.title}</strong>
            <br />
            {place.location}
            <br />
            ⭐ {place.rating}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default DestinationMap;
