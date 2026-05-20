// authController.js - resetPasswordRedirect funkcija
exports.resetPasswordRedirect = (req, res) => {
  const { userId, token } = req.query;

  // Provera da li su userId i token prisutni
  if (!userId || !token) {
    console.error("❌ Nedostaju userId ili token u zahtevu.");
    return res.status(400).send("Nedostaju potrebni parametri.");
  }

  console.log("🔗 resetPasswordRedirect pozvan:", {
    userId,
    token: token?.substring(0, 20) + "..." // Maskiranje tokena u logovima
  });

  // Generisanje deep linkova
  const deepLink = `vibra-date://reset-password?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
  const intentLink = `intent://reset-password?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}#Intent;scheme=vibra-date;package=com.marko.vibra;end`;

  // Slanje odgovora sa fallback opcijom
  res.send(`
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #FCFCFD; }
          a { color: #FF6A00; font-weight: bold; }
        </style>
      </head>
      <body>
        <script>
          try {
            window.location.href = "${intentLink}";
          } catch (error) {
            console.error("❌ Greška prilikom preusmeravanja na intent link:", error);
            window.location.href = "${deepLink}"; // Fallback na deep link
          }
        </script>
        <p>Otvara VibrA aplikaciju...</p>
        <p>Ako se aplikacija ne otvori automatski, <a href="${intentLink}">klikni ovde</a>.</p>
      </body>
    </html>
  `);
};