import styles from "@/components/pages/GameSiagaMinang.module.css";
export default function MinangIcon({
  index,
  className = "",
}: {
  index: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={styles.itemIcon + " " + className}
      style={{
        backgroundPosition: `${((index % 4) / 3) * 100}% ${(Math.floor(index / 4) / 2) * 100}%`,
      }}
    />
  );
}
