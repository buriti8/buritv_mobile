import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { styles } from '../styles/styles';

export default function CountdownDots() {
    const [dots, setDots] = useState(3);

    useEffect(() => {
        const iv = setInterval(() => setDots((d) => (d > 0 ? d - 1 : 0)), 1000);
        return () => clearInterval(iv);
    }, []);

    const filled = '● '.repeat(dots);
    const empty = '○ '.repeat(3 - dots);

    return <Text style={styles.errorDots}>{filled}{empty}</Text>;
}
