"use client";

import Footer from "./components/organism/Footer";
// import Header from "./components/organism/Header";
import Main from "./components/organism/Main";
import { SiteContentProvider } from "./components/providers/SiteContentProvider";

function App() {
  return (
    <SiteContentProvider>
      <div className="bg-platinum font-primary flex min-h-dvh w-full flex-col justify-between gap-8 px-3 py-3 md:px-12 xl:px-24 xl:pt-12 2xl:px-60">
        {/* <Header /> */}
        <Main />
        <Footer />
      </div>
    </SiteContentProvider>
  );
}

export default App;
