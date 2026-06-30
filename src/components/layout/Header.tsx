"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LOGO_SRC, NAV_LINKS } from "@/lib/constants";
import { CloseIcon, MenuIcon, SearchIcon, UserIcon, PhoneIcon } from "@/components/icons";
import { useAuth } from "@/components/account/AuthModalProvider";
import { useConsultationModal } from "@/components/consultation/ConsultationModalProvider";
import { SiteContainer } from "./SiteContainer";
import { CartButton } from "./CartButton";
import { FavoritesButton } from "./FavoritesButton";
import {
  HEADER_ICON_BUTTON_CLASS,
  HEADER_ICON_CLASS,
  HEADER_ICON_PHONE_CLASS,
} from "./header-icon-styles";
import { SearchBar } from "./SearchBar";

function NavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <>
      {NAV_LINKS.map((link) =>
        link.href.startsWith("#") ? (
          <a
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={className}
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={className}
          >
            {link.label}
          </Link>
        ),
      )}
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const { user, loading, openLogin } = useAuth();
  const { openConsultation } = useConsultationModal();
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const updateHeight = () => setHeaderHeight(node.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header
        ref={headerRef}
        data-site-header
        className="fixed top-0 left-0 right-0 z-50 bg-white"
      >
        <div className="border-b border-stone-200">
          <SiteContainer>
            <div className="flex h-[92px] items-center justify-between gap-3">
              <Link
                href="/"
                className="relative block h-[46px] w-[73px] shrink-0 sm:h-[72px] sm:w-[114px]"
              >
                <Image
                  src={LOGO_SRC}
                  alt="Nega Lingerie"
                  fill
                  className="object-contain object-left"
                  priority
                  sizes="(max-width: 640px) 73px, 114px"
                />
              </Link>

              <nav className="hidden flex-1 items-center justify-center gap-6 xl:gap-10 lg:flex">
                <NavLinks className="text-sm font-medium uppercase tracking-[0.12em] text-[#260402] transition hover:opacity-70" />
              </nav>

              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <button
                  ref={searchToggleRef}
                  type="button"
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Поиск"
                  aria-expanded={searchOpen}
                  className={`${HEADER_ICON_BUTTON_CLASS} ${
                    searchOpen ? "bg-stone-100 lg:bg-transparent" : ""
                  }`}
                >
                  <SearchIcon className={HEADER_ICON_CLASS} />
                </button>
                <FavoritesButton />
                <button
                  type="button"
                  onClick={openConsultation}
                  aria-label="Заявка на консультацию"
                  className={HEADER_ICON_BUTTON_CLASS}
                >
                  <PhoneIcon className={HEADER_ICON_PHONE_CLASS} />
                </button>
                {loading ? (
                  <span
                    className="flex h-10 w-10 items-center justify-center text-stone-300"
                    aria-hidden
                  >
                    <UserIcon />
                  </span>
                ) : user ? (
                  <Link
                    href="/account"
                    aria-label="Личный кабинет"
                    className={HEADER_ICON_BUTTON_CLASS}
                  >
                    <UserIcon className={HEADER_ICON_CLASS} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openLogin}
                    aria-label="Войти в личный кабинет"
                    className={HEADER_ICON_BUTTON_CLASS}
                  >
                    <UserIcon className={HEADER_ICON_CLASS} />
                  </button>
                )}
                <CartButton />
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
                  aria-expanded={menuOpen}
                  className="flex h-10 w-10 items-center justify-center text-[#260402] transition hover:bg-stone-100 lg:hidden"
                >
                  {menuOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
              </div>
            </div>

            {menuOpen && (
              <nav className="border-t border-stone-100 py-4 lg:hidden">
                <ul className="flex flex-col">
                  {NAV_LINKS.map((link) => (
                    <li key={link.href}>
                      {link.href.startsWith("#") ? (
                        <a
                          href={link.href}
                          onClick={closeMenu}
                          className="block py-3 text-sm font-medium uppercase tracking-[0.12em] text-[#260402] transition hover:opacity-70"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          onClick={closeMenu}
                          className="block py-3 text-sm font-medium uppercase tracking-[0.12em] text-[#260402] transition hover:opacity-70"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </SiteContainer>
        </div>

        <SearchBar
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          toggleRef={searchToggleRef}
        />
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Закрыть меню"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={closeMenu}
        />
      )}

      <div aria-hidden style={{ height: headerHeight }} />
    </>
  );
}
