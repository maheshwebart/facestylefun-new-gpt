export function loadScript(src: string): Promise<boolean> {
    return new Promise((resolve) => {
        const el = document.createElement("script");
        el.src = src;
        el.onload = () => resolve(true);
        el.onerror = () => resolve(false);
        document.body.appendChild(el);
    });
}
