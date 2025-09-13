"use client";
import { useEffect } from "react";
import { useDispatch, Provider } from "react-redux";
import { setUsername, setId, setPictureUrl, setExp } from "@/store/userSlice";
import store from "@/store/store";
import useTokenRefresh from "@/hooks/useTokenRefresh";

interface ClientProviderProps {
  id: string;
  username: string;
  pictureUrl: string;
  exp: number;
  children: React.ReactNode;
}

function UserProvider({
  id,
  username,
  pictureUrl,
  exp,
  children,
}: ClientProviderProps) {
  const dispatch = useDispatch();
  useTokenRefresh({ bufferSeconds: 60 });

  useEffect(() => {
    dispatch(setId(id));
    dispatch(setUsername(username));
    dispatch(setPictureUrl(pictureUrl));
    dispatch(setExp(exp));
  }, [id, username, pictureUrl, exp, dispatch]);

  return <>{children}</>;
}

export default function ClientProvider({
  id,
  username,
  pictureUrl,
  exp,
  children,
}: ClientProviderProps) {
  return (
    <Provider store={store}>
      <UserProvider
        id={id}
        username={username}
        pictureUrl={pictureUrl}
        exp={exp}
      >
        {children}
      </UserProvider>
    </Provider>
  );
}
