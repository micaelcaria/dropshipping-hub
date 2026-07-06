import { Router } from 'express'
import { checkCredentials, issueToken } from '../auth.js'

const router = Router()

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!checkCredentials(email, password)) {
    return res.status(401).json({ error: 'Email ou password incorretos' })
  }
  res.json({ token: issueToken(), email })
})

export default router
