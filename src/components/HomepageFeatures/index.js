import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Start Here',
    Svg: require('@site/static/img/rocket-2-svgrepo-com.svg').default,
    description: (
      <>
        New team onboarding: philosophy, how this project fails, and how to get
        from clone → build → flash without wasting two weeks.
        <br />
        <a href="/ut-core-docs/start-here">Go to Start Here →</a>
      </>
    ),
  },
  {
    title: 'Architecture',
    Svg: require('@site/static/img/rocket-2-svgrepo-com.svg').default,
    description: (
      <>
        System overview, subsystem responsibilities, modes, and how power/data
        move through UT-CORE.
        <br />
        <a href="/ut-core-docs/architecture">View Architecture →</a>
      </>
    ),
  },
  {
    title: 'Interfaces (ICDs)',
    Svg: require('@site/static/img/rocket-2-svgrepo-com.svg').default,
    description: (
      <>
        CAN ID scheme, message definitions, connectors, pinouts, and bus maps.
        This is where integration is won or lost.
        <br />
        <a href="/ut-core-docs/interfaces">View Interfaces →</a>
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
