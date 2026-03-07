// Middleware per protegir rutes - requereix autenticació

const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: 'No autoritzat',
      message: 'Has d\'iniciar sessió per accedir a aquest recurs'
    });
  }
  next();
};

module.exports = requireAuth;
