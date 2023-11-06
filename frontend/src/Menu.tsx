export const Menu = ({
  timeness,
  setTimeness,
}: {
  timeness: number;
  setTimeness: (timeness: number) => void;
}) => {
  return (
    <div
      className={
        // center horizontally
        "w-full md:w-auto " +
        "md:left-1/2 md:-translate-x-1/2 " +
        "absolute bottom-0 p-3 " +
        "bg-primary text-white " +
        "flex justify-between items-center gap-3 " +
        "text-xl text-right"
      }
    >
      <div className="flex justify-between items-center gap-3 ">
        <span>Space</span>
        <input
          id="default-range"
          type="range"
          min="0"
          max="1"
          step="0.1"
          className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer"
          value={timeness}
          onChange={(e) => {
            setTimeness(parseFloat(e.target.value));
          }}
        />
        <span>Time</span>
      </div>
      <span>About</span>

      {/* Commented out for debugging */}
      {/* <div>Map data ©Google</div> */}
    </div>
  );
};
