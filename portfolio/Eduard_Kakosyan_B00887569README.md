# Personal Portfolio Website

## Links

* [Lab 7 Gitlab](https://git.cs.dal.ca/kakosyan/csci3172/-/tree/main/labs/lab7)
* [Lab 7 Netlify](https://eduardkakosyan.netlify.app/)

* *Date Created*: March 20 2025
* *Last Modification Date*: March 20 2025

## Authors

If what is being submitted is an individual Lab or Assignment, you may simply include your name and email address. Otherwise list the members of your group.

* [Eduard Kakosyan](kakosyaneduard@dal.ca) - (Student)

## Technologies Used
Render for API hosting - I seperated back-end from front end using folder structure. This way if the back-end goes down, the front-end is still able to load. 
Netlify - Front-end is hosted on Netlify, I used NextJS for the front-end build since it has better routing and middleware abilities.


## Pages

- **Home**: Landing page with a brief introduction and skills overview
- **About**: Detailed information about education, experience, and technical skills
- **Skills**: A list of skills
- **Projects**: Showcase of projects with descriptions and technologies used
- **404**: Custom error page for handling unknown routes

## Technologies Used

- React 19
- TypeScript
- Jest for testing
- NextJS
- ShadCN
- TailwindCSS

## Testing
The project includes unit tests for components using Jest and React Testing Library. To run the tests:

```bash
npm test
```

The tests verify:
- Component rendering
- Navigation functionality
- Proper display of content
- Accessibility features

## Building for Production

To build the project for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.
