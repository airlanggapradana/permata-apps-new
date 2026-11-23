import styles from "@/components/pages/GameHealing.module.css";

export default function BagArtwork({
  index,
  className = "",
}: {
  index: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={styles.artwork + " " + className}
      style={{
        backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
      }}
    />
  );
}
