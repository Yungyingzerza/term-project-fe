"use client";
import { useEffect } from "react";
import { useDispatch, Provider } from "react-redux";
import { setUsername, setId, setPictureUrl } from "@/store/userSlice";
import store from "@/store/store";

interface ClientProviderProps {
  id: string;
  username: string;
  pictureUrl: string;
  children: React.ReactNode;
}

function UserProvider({
  id,
  username,
  pictureUrl,
  children,
}: ClientProviderProps) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setId(id));
    dispatch(setUsername(username));
    dispatch(setPictureUrl(pictureUrl));
  }, [id, username, pictureUrl, dispatch]);

  return <>{children}</>;
}

export default function ClientProvider({
  id,
  username,
  pictureUrl,
  children,
}: ClientProviderProps) {
  return (
    <Provider store={store}>
      <UserProvider id={id} username={username} pictureUrl={pictureUrl}>
        {children}
      </UserProvider>
    </Provider>
  );
}
