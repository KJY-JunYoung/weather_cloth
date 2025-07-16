// ClothCard.jsx
import './clothCard.css'
function ClothCard({ cloth, onEdit, isSelected }) {
  return (
    <div
      className={`cloth-card ${isSelected ? "selected" : ""}`}
      onClick={() => onEdit(cloth)}
    >
      <img src={`http://localhost:3000${cloth.imageUrl}`} alt={cloth.name} />
      <p>{cloth.name}</p>
    </div>
  );
}

export default ClothCard;
