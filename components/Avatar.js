import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import { resolveMediaUrl } from "../utils/media";

const FALLBACK = require("../assets/icons/user.png");

export default function Avatar({ photoURL = "", uri = "", style }) {
  const [failed, setFailed] = useState(false);
  const resolved = uri || resolveMediaUrl(photoURL);
  useEffect(() => {
    setFailed(false);
  }, [resolved]);
  const source = resolved && !failed ? { uri: resolved } : FALLBACK;
  return <Image source={source} style={style} onError={() => setFailed(true)} />;
}
