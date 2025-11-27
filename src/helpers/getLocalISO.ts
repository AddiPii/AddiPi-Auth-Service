export default function getLocalISO(): string{
    const now: Date = new Date();
    const localISO = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
    timeZone: 'Europe/Warsaw'
    }).format(now).replace(' ', 'T') + 'Z';

    return localISO
}
