/** Only owner-entered public settings are used; no address components are guessed. */
export function postalAddress(settings: Record<string, string>) {
  const fields = [
    'address_street',
    'address_locality',
    'address_region',
    'address_postal_code',
    'address_country',
  ] as const;
  if (!fields.every((field) => settings[field]?.trim())) return undefined;
  return {
    '@type': 'PostalAddress' as const,
    streetAddress: settings.address_street.trim(),
    addressLocality: settings.address_locality.trim(),
    addressRegion: settings.address_region.trim(),
    postalCode: settings.address_postal_code.trim(),
    addressCountry: settings.address_country.trim().toUpperCase(),
  };
}
export function formattedAddress(settings: Record<string, string>) {
  const address = postalAddress(settings);
  return address
    ? [
        address.streetAddress,
        address.addressLocality,
        address.addressRegion,
        address.postalCode,
        address.addressCountry,
      ].join(', ')
    : settings.address?.trim() || '';
}
export function privacyNoticeReady(settings: Record<string, string>) {
  return !!(
    settings.privacy_contact_email?.trim() &&
    settings.privacy_retention?.trim() &&
    settings.privacy_reviewed_on?.trim()
  );
}
