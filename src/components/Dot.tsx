export const Dot: React.FC<{ size: number }> = ({ size }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "100%",
        backgroundColor: "black",
        opacity: 0.25,
      }}
    ></div>
  );
};
