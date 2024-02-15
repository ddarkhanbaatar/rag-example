## Getting Started

1. Clone the repo

```
git clone [github https url]
```

2. Install packages

```
npm install
```

3. Set up your `.env` file

- Change `.env.example` into `.env` and fill the neccessary keys.
- For OPENAI API key visit [openai](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key)
- For Google AI key

4. Run the development server:

```
npm run dev
```

## Deploy on Vercel

!! If your Vercel app throws back a timeout error when deployed, the response is taking more than 5s, which is the limit of a free Vercel plan.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)

Check out [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
