import axios from "axios";

const devUrl = "http://localhost:8080";
const isDev = import.meta.env.MODE === "development";
const baseURL = isDev ? devUrl : "/";

// Re-export cn from lib/utils
export { cn } from "@/lib/utils";

export const http = axios.create({
  baseURL,
});

export function getVideoURL(url: string) {
  if (isDev) {
    return `${devUrl}/${url}`;
  }
  return url;
}
