import { Style } from "@/lib/learning";
import { Button, Center, Group, MultiSelect, Stack, Text } from "@mantine/core";
import { useToggle } from "@mantine/hooks";
import { useEffect, useState } from "react";

const colorData = ["Red", "Blue", "Green", "Yellow", "White", "Black"]
  const seasonData = ["Summer", "Fall", "Winter", "Spring"]
  const usageData = ["Casual", "Sports", "Ethnic", "Formal"]

interface AutoClickerProps {
    style: Style;
    sampleCallback: (style: Style, pos: boolean) => void;
    loading: boolean;
}

function Autoclicker({style, sampleCallback, loading}: AutoClickerProps) {

    const [enabled, setEnabled] = useState(false);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedUsages, setSelectedUsages] = useState<string[]>([]);
    const [selectedSeasons, setSelectedSeaons] = useState<string[]>([]);

    useEffect(() => {
        if(enabled && loading) {
            setTimeout(() => {
                if(selectedColors.includes(style.baseColour) && selectedUsages.includes(style.usage) && selectedSeasons.includes(style.season)) {
                    sampleCallback(style, true);
                } else {
                    sampleCallback(style, false);
                }
            }, 1000);
        }
    }, [loading, enabled])

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
                dropdownPosition="top"
            />
            <MultiSelect
                style={{width: "30%"}}
                data={seasonData}
                label="Season"
                value={selectedSeasons}
                onChange={setSelectedSeaons}
                clearable
                dropdownPosition="top"
            />
            <MultiSelect
                style={{width: "30%"}}
                data={usageData}
                label="Usage"
                value={selectedUsages}
                onChange={setSelectedUsages}
                clearable
                dropdownPosition="top"
            />
        </Group>
        <Button onClick={() => setEnabled((value) => !value)} color={enabled ? "red" : "green"}>
            {enabled ? "Disable" : "Enable"}
        </Button>
    </Stack>
}

export default Autoclicker;