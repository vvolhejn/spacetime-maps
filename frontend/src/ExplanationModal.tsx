import { ReactNode } from "react";
import { isTouchscreen } from "./useIsMobile";

const B = ({ children }: { children: ReactNode }) => {
  return <span className="font-bold">{children}</span>;
};

export const ExplanationModal = () => {
  return (
    <div className="absolute flex justify-center items-center w-screen lg:w-full h-full">
      <div className="bg-primary text-white text-lg bg-opacity-80 p-4 w-[32rem] flex flex-col gap-2">
        <p>
          This is a map that can show <B>time</B> instead of space. Points that
          are close but take a long time to travel between (by car) get pushed
          away from each other, and vice versa. This means that everything that
          looks close together is actually fast to travel between.
        </p>
        <p>
          <B>{isTouchscreen() ? "Touch" : "Click"} and hold</B> to switch to
          time mode.
        </p>
      </div>
    </div>
  );
};
