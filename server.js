
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const axios = require('axios');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GitHubStrategy({
    clientID: 'Ov23lieCLPddkV8cxP0T',
    clientSecret: '7b6d4359dfc687c406233a47e4ef7a2f5a0569d0',
    callbackURL: 'https://crispy-capybara-jv649969gp4h5945-3000.app.github.dev/auth/github/callback'
}, (accessToken, refreshToken, profile, cb) => {
    return cb(null, { profile, accessToken });
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback', 
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    }
);

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/repos', ensureAuthenticated, async (req, res) => {
    const accessToken = req.user.accessToken;
    const response = await axios.get('https://api.github.com/user/repos', {
        headers: { Authorization: `token ${accessToken}` }
    });
    const repos = response.data;
    res.render('repos', { repos });
});

app.get('/repos/:owner/:repo', ensureAuthenticated, async (req, res) => {
    const { owner, repo } = req.params;
    const accessToken = req.user.accessToken;
    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Authorization: `token ${accessToken}` }
    });
    const contentsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents`, {
        headers: { Authorization: `token ${accessToken}` }
    });
    const repoData = repoResponse.data;
    const contents = contentsResponse.data;
    res.render('repo', { repo: repoData, contents, owner, repo });
});

app.get('/repos/:owner/:repo/blob/*', ensureAuthenticated, async (req, res) => {
    const { owner, repo } = req.params;
    const path = req.params[0];
    const accessToken = req.user.accessToken;
    const fileResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `token ${accessToken}` },
        params: { ref: 'main' }
    });
    const fileData = fileResponse.data;
    if (fileData.encoding === 'base64') {
        fileData.content = Buffer.from(fileData.content, 'base64').toString('utf8');
    }
    res.render('file', { file: fileData, repo, owner });
});

app.get('/search', async (req, res) => {
    const query = req.query.query;
    let repos = [];
    if (query) {
        const response = await axios.get(`https://api.github.com/search/repositories?q=${query}`);
        repos = response.data.items;
    }
    res.render('search', { query, repos });
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
