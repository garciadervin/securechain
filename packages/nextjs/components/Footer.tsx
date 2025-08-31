export const Footer = () => {
  return (
    <footer className="w-full py-6 px-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex flex-col md:flex-row justify-center items-center gap-3 text-center">
        <a
          href="https://github.com/garciadervin/securechain"
          target="_blank"
          rel="noreferrer"
          className="hover:underline cursor-pointer"
        >
          Ver código fuente
        </a>
        <span className="hidden md:inline">·</span>
        <p className="m-0">
          Desarrollado con 💚 por <span className="font-semibold text-emerald-500">SecureChain</span>
        </p>
        <span className="hidden md:inline">·</span>
        <a
          href="https://t.me/garciadervin"
          target="_blank"
          rel="noreferrer"
          className="hover:underline cursor-pointer"
        >
          Soporte
        </a>
      </div>
    </footer>
  );
};