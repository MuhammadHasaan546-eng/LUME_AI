import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useDispatch, useSelector } from "react-redux";
import { setResolvedTheme, setThemePreference } from "@/store/theme";

const ThemeStoreSync = () => {
  const dispatch = useDispatch();
  const selectedTheme = useSelector((state) => state.theme.selectedTheme);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setTheme(selectedTheme);
  }, [selectedTheme, setTheme]);

  useEffect(() => {
    if (resolvedTheme) {
      dispatch(setResolvedTheme(resolvedTheme));
    }
  }, [dispatch, resolvedTheme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("lume-theme");

    if (savedTheme && savedTheme !== selectedTheme) {
      dispatch(setThemePreference(savedTheme));
    }
  }, [dispatch, selectedTheme]);

  return null;
};

export default ThemeStoreSync;
