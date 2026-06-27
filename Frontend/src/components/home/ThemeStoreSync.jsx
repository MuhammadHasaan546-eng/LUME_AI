import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useDispatch, useSelector } from "react-redux";
import { setResolvedTheme } from "@/store/theme";

const ThemeStoreSync = () => {
  const dispatch = useDispatch();
  const selectedTheme = useSelector((state) => state.theme.selectedTheme);
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (selectedTheme && theme !== selectedTheme) {
      setTheme(selectedTheme);
    }
  }, [selectedTheme, setTheme, theme]);

  useEffect(() => {
    if (resolvedTheme) {
      dispatch(setResolvedTheme(resolvedTheme));
    }
  }, [dispatch, resolvedTheme]);

  return null;
};

export default ThemeStoreSync;
