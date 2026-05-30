export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getErrorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || error?.message || fallback;
}
