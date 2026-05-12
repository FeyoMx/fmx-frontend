import { QueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

let displayedNetworkFailureError = false;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry(failureCount) {
        if (failureCount >= 3) {
          if (displayedNetworkFailureError === false) {
            displayedNetworkFailureError = true;

            toast.error("La aplicación está tardando más de lo esperado. Intenta de nuevo en unos minutos.", {
              onClose: () => {
                displayedNetworkFailureError = false;
              },
            });
          }

          return false;
        }

        return true;
      },
    },
  },
});
