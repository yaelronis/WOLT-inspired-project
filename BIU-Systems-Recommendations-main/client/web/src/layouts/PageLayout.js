// @ts-check
import Navbar from "../components/NavBar/navBar";
// @ts-ignore
import CancelWindowButton from "../components/CancelWindowButton";

// @ts-ignore
import "../styles/PageLayout.css";

/**
 * General layout for application pages.
 * Adds shared navbar and page spacing.
 *
 * @param {{ children: import("react").ReactNode }} props
 */
function PageLayout({ children }) {
  return (
    <>
      <Navbar />

      <main className="page-content">
        {children}
      </main>

      {/* Follows the user for 15 min after placing an order, to cancel it. */}
      <CancelWindowButton />
    </>
  );
}

export default PageLayout;