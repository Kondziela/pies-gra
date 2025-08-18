import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

/**
 * Configure Amplify with generated outputs from Gen 2 backend
 */
Amplify.configure(outputs);

export default outputs;
