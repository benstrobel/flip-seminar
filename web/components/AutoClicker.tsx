import { Button, Center, Group, MultiSelect, Stack, Text } from "@mantine/core";
import { useToggle } from "@mantine/hooks";
import { useState } from "react";

const colorData = ["Red", "Blue", "Green", "Yellow", "White", "Black"]
  const seasonData = ["Summer", "Fall", "Winter", "Spring"]
  const usageData = ["Casual", "Sports", "Ethnic", "Formal"]

function Autoclicker() {

    const [enabled, setEnabled] = useState(false);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedUsages, setSelectedUsages] = useState<string[]>([]);
    const [selectedSeasons, setSelectedSeaons] = useState<string[]>([]);

    return <Stack justify="center" align="Center">
        <Text>{"Auto Liker"}</Text>
        <Group position="center" style={{width: "40vw"}}>
            <MultiSelect
                style={{width: "30%"}}
                data={colorData}
                label="Colors"
                value={selectedColors}
                onChange={setSelectedColors}
                clearable
            />
            <MultiSelect
                style={{width: "30%"}}
                data={seasonData}
                label="Season"
                value={selectedUsages}
                onChange={setSelectedUsages}
                clearable
            />
            <MultiSelect
                style={{width: "30%"}}
                data={usageData}
                label="Usage"
                value={selectedSeasons}
                onChange={setSelectedSeaons}
                clearable
            />
        </Group>
        <Button onClick={() => setEnabled((value) => !value)} color={enabled ? "red" : "green"}>
            {enabled ? "Disable" : "Enable"}
        </Button>
    </Stack>
}

export default Autoclicker;