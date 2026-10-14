# Services

1. `backend` - Provides recommendations to `api`, written in C++.
   * provides a testing suite `test`.
   * can be run natively only on linux.
2. `pyclient` - naive backend client used in testing `backend`, written in Python.
3. `api` - API and a simple web client service, written in Javascript, served with Express.
   1. API is accessed through `/api`.
   2. web client is accessed through `/`.
   - Dependent on `backend`, `mongo`.
     - starts them automatically on docker.
4. `mobile` - a mobile client service, written in Javascript, served with Expo.
   * if ran using docker, may only be used to test using the `web` configuration, to use an android emulator, must be ran natively.
    - dependent on `api`, `mongo`.
      - starts them automatically on docker.
5. `mongo` - Database, used by `api`.
   * only available as a docker service.
