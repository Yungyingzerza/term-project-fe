"use client";
import { useEffect } from "react";
import { useDispatch, Provider } from "react-redux";
import {
  setUsername,
  setId,
  setPictureUrl,
  setExp,
  setHandle,
} from "@/store/userSlice";
import store from "@/store/store";
import useTokenRefresh from "@/hooks/useTokenRefresh";

interface ClientProviderProps {
  id: string;
  username: string;
  pictureUrl: string;
  exp: number;
  handle: string;
  children: React.ReactNode;
}

function UserProvider({
  id,
  username,
  pictureUrl,
  exp,
  handle,
  children,
}: ClientProviderProps) {
  const dispatch = useDispatch();
  useTokenRefresh({ bufferSeconds: 60 });

  useEffect(() => {
    dispatch(setId(id));
    dispatch(setUsername(username));
    dispatch(setPictureUrl(pictureUrl));
    dispatch(setExp(exp));
    dispatch(setHandle(handle));
  }, [id, username, pictureUrl, exp, handle, dispatch]);

  return <>{children}</>;
}

export default function ClientProvider({
  id,
  username,
  pictureUrl,
  exp,
  handle,
  children,
}: ClientProviderProps) {
  return (
    <Provider store={store}>
      <UserProvider
        id={id}
        username={username}
        pictureUrl={pictureUrl}
        exp={exp}
        handle={handle}
      >
        {children}
      </UserProvider>
    </Provider>
  );
}
