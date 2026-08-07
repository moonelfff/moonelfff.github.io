import Pricelist from "./Pricelist";
import Profile from "./Profile";

function Main() {
  return (
    <main className="flex grow flex-col gap-8 text-black">
      <Profile />
      <Pricelist />
    </main>
  );
}

export default Main;
