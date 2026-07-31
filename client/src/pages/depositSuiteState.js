export function finishSection(previous, { data, error }) {
  if (error) return { ...previous, loading: false, error };
  return { ...previous, loading: false, error: "", data };
}

export function shouldShowInitialLoader(initialLoading) { return initialLoading === true; }

export function hasActiveSchemes(schemes) { return schemes.some((scheme) => scheme.status === "ACTIVE"); }
