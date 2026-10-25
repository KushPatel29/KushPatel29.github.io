import { expect, test } from "@playwright/test";

test("malformed paths return an error while the preview keeps serving", async ({ request }) => {
  for (const pathname of ["/%E0%A4", "/%", "//"]) {
    const response = await request.get(`http://127.0.0.1:4173${pathname}`);
    expect(response.status()).toBe(400);
    const home = await request.get("/");
    expect(home.status()).toBe(200);
    expect(await home.text()).toContain("Kush Patel");
  }
});

test("tour captions and media have their declared content types", async ({ request }) => {
  for (const [name, type] of [["growthops-tour.vtt", "text/vtt"], ["growthops-tour.mp4", "video/mp4"], ["growthops-tour.webm", "video/webm"]]) {
    const response = await request.head(`/assets/video/${name}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain(type);
  }
});
