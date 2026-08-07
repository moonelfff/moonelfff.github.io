import Glass from "../atom/Glass";

type Props = {
  children: React.ReactNode;
};

function Card({ children }: Props) {
  return (
    <div className="flex-1 pb-2 lg:max-w-180 lg:min-w-100">
      <Glass>
        <div className="text-platinum flex h-full flex-col justify-between p-6">
          {children}
        </div>
      </Glass>
    </div>
  );
}

export default Card;
