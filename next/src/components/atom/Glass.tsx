type Props = {
  children: React.ReactNode;
};

function Glass({ children }: Props) {
  return (
    <div className="shadow-effect shadow-effect-offset mt-2 h-full">
      <div className="backdrop-glass backdrop-glass-offset h-full">
        {children}
      </div>
    </div>
  );
}

export default Glass;
