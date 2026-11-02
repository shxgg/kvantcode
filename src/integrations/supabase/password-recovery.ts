
import { useEffect, useState } from "react";
import { supabase } from "./client";

const STORAGE_KEY = "kvantcode:password-recovery";
const MAX_AGE = 30 * 60 * 1000;

type RecoveryState = {
  pending: boolean;
  ready: boolean;
};

type RecoveryListener = (pending: boolean) => void;

function readRecoveryState(fallback = false): boolean {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);

    if (!value) return false;

    const timestamp = Number(value);

    if (
      !Number.isFinite(timestamp) ||
      timestamp <= 0 ||
      Date.now() - timestamp > MAX_AGE
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    return true;
  } catch {
    return fallback;
  }
}

// Estado inicial recuperado del almacenamiento local.
let recoveryPending = readRecoveryState();

const listeners = new Set<RecoveryListener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    listener(recoveryPending);
  });
}

function markRecoveryPending() {
  recoveryPending = true;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        String(Date.now()),
      );
    } catch {
      // Se conserva el estado en memoria si el almacenamiento falla.
    }
  }

  notifyListeners();
}

export function clearPasswordRecovery() {
  recoveryPending = false;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // La limpieza en memoria sigue siendo efectiva.
    }
  }

  notifyListeners();
}

// Listener global: captura PASSWORD_RECOVERY
// independientemente de que React ya esté montado.
supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    markRecoveryPending();
  }
});

export function usePasswordRecoveryState(): RecoveryState {
  const [state, setState] = useState<RecoveryState>({
    pending: recoveryPending,
    ready: false,
  });

  useEffect(() => {
    const updateState: RecoveryListener = (pending) => {
      setState({
        pending,
        ready: true,
      });
    };

    listeners.add(updateState);

    // Sincroniza el estado al montar el componente.
    recoveryPending = readRecoveryState(recoveryPending);
    updateState(recoveryPending);

    return () => {
      listeners.delete(updateState);
    };
  }, []);

  return state;
}
